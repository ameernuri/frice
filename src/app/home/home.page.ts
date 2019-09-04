import { Component, Pipe, PipeTransform } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

import { switchMap, map } from 'rxjs/operators';
import { interval, Observable, of } from 'rxjs';
import { beeps } from '../b64sounds';
import * as moment from 'moment';

interface Task {
	id?: string;
  created_at: string;
  title: string;
  stars: number;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  time: Observable<any>;
  inputTask: string;
  tasks: Observable<Task[]>;
	selectedTask: string;
	Array = Array;
	inputStars: number = 0;

  constructor(
    private db: AngularFirestore
  ) {
    this.time = interval(1000).pipe(
      switchMap((v, i) => {
        const second = +moment().format('s')
        const minute = +moment().format('m')
        const hour = +moment().format('H')

        if (second === 0 && (minute === 0 || minute === 30)) {
          beeps.double.play();
        }

        if ((minute === 29 || minute === 59) && second > 56) {
          beeps.single.play();
        }

        return of({
          second,
          minute,
          hour,
        })
      })
    );

		this.fetchTasks();
  }

  addTask() {
    this.db.collection('tasks').add({
      created_at: new Date().getTime(),
      title: this.inputTask,
      stars: this.inputStars,
			checked: false,
    })

		this.inputTask = '';
		this.inputStars = 0;
  }

	processInput() {
		this.inputTask.replace(/^\*/, '')
	}

  fetchTasks() {
    this.tasks = this.db.collection('tasks', ref => {
			return ref
				.orderBy('checked')
				.orderBy('stars', 'desc')
				.orderBy('created_at', 'desc')
		}).valueChanges({
			idField: 'id'
		}) as Observable<Task[]>;
  }

	delete(id: string) {
		this.db.collection('tasks').doc(id).delete()
	}

	check(id: string, checked: boolean = true) {
		this.db.collection('tasks').doc(id).update({
			checked: checked,
			checked_at: new Date().getTime()
		})
	}

	select(id?: string) {
		this.selectedTask = this.selectedTask == id ? null : id
	}

	star(id: string, currentStars: number, direction: number = 1) {
		const updateStars = currentStars + direction;
		const stars = updateStars < 0 || updateStars > 5
			? currentStars
			: updateStars;

		this.db.collection('tasks').doc(id).update({
			stars
		})
	}

	inputStar(number: number) {
		const updateStars = this.inputStars + number;

		this.inputStars = updateStars < 0 ? 0 : (
			updateStars > 5 ? 5 : updateStars
		);
	}

}
